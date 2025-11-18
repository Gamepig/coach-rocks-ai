import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import axios from "axios";

const ConvertMp4ToMp3Request = z.object({}); // No body fields, just file upload

export class ConvertMp4ToMp3 extends OpenAPIRoute {
  schema = {
    tags: ["Media"],
    summary: "Convert an uploaded mp4 file to mp3 using CloudConvert and return the mp3 file",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: {},
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the converted mp3 file",
        content: {
          "audio/mpeg": {
            schema: z.any(),
          },
        },
      },
      "400": {
        description: "Bad request",
        content: {
          "application/json": {
            schema: z.object({ success: z.boolean(), error: z.string() }),
          },
        },
      },
      "500": {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: z.object({ success: z.boolean(), error: z.string() }),
          },
        },
      },
    },
  };

  // 'any' is used for context type due to Hono/chanfana integration
  async handle(c: any) {
    try {
      const apiKey = c.env.CLOUDCONVERT_API_KEY;
      if (!apiKey) {
        return c.json({ success: false, error: "CLOUDCONVERT_API_KEY is not set in environment variables" }, 500);
      }
      const formData = await c.req.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return c.json({ success: false, error: "No file uploaded" }, 400);
      }
      // 1. Create a CloudConvert job
      const jobRes = await axios.post(
        "https://api.cloudconvert.com/v2/jobs",
        {
          tasks: {
            import: {
              operation: "import/upload"
            },
            convert: {
              operation: "convert",
              input: "import",
              input_format: "mp4",
              output_format: "mp3"
            },
            export: {
              operation: "export/url",
              input: "convert"
            }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      const jobId = jobRes.data.data.id;
      const importTask = Object.values(jobRes.data.data.tasks).find((t: any) => (t as any).operation === "import/upload") as any;
      const uploadUrl = importTask.result.form.url;
      const uploadParams = importTask.result.form.parameters;
      // 2. Upload the file to CloudConvert
      const uploadForm = new FormData();
      for (const [key, value] of Object.entries(uploadParams)) {
        uploadForm.append(key, value as string);
      }
      uploadForm.append("file", file, file.name);
      await fetch(uploadUrl, {
        method: "POST",
        body: uploadForm,
      });
      // 3. Poll for job completion
      let jobStatus = "waiting";
      let mp3Url = null;
      for (let i = 0; i < 30; i++) { // Poll up to 30 times (about 30 seconds)
        await new Promise(res => setTimeout(res, 1000));
        const pollRes = await axios.get(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        jobStatus = pollRes.data.data.status;
        if (jobStatus === "finished") {
          const exportTask = pollRes.data.data.tasks.find((t: any) => (t as any).operation === "export/url") as any;
          if (exportTask && exportTask.result && exportTask.result.files && exportTask.result.files.length > 0) {
            mp3Url = exportTask.result.files[0].url;
            break;
          }
        } else if (jobStatus === "error" || jobStatus === "canceled") {
          return c.json({ success: false, error: `CloudConvert job failed: ${jobStatus}` }, 500);
        }
      }
      if (!mp3Url) {
        return c.json({ success: false, error: "Timed out waiting for CloudConvert job to finish" }, 500);
      }
      // 4. Download the mp3 file
      const mp3Res = await axios.get(mp3Url, { responseType: "arraybuffer" });
      // 5. Send mp3 to Deepgram API for transcription with diarization and smart_format
      const deepgramApiKey = c.env.DEEPGRAM_DEV_API_KEY;
      if (!deepgramApiKey) {
        return c.json({ success: false, error: "DEEPGRAM_DEV_API_KEY is not set in environment variables" }, 500);
      }
      const deepgramRes = await fetch("https://api.deepgram.com/v1/listen?diarize=true&smart_format=true", {
        method: "POST",
        headers: {
          "Authorization": `Token ${deepgramApiKey}`,
          "Content-Type": "audio/mpeg"
        },
        body: mp3Res.data
      });
      if (!deepgramRes.ok) {
        const errText = await deepgramRes.text();
        return c.json({ success: false, error: `Deepgram API error: ${errText}` }, 500);
      }
      const deepgramData = await deepgramRes.json();
      const diarizationTranscript = deepgramData?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.transcript || null;
      return c.json({ success: true, transcript: diarizationTranscript });
    } catch (error) {
      console.error("CloudConvert MP4 to MP3 error:", error);
      return c.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  }
} 