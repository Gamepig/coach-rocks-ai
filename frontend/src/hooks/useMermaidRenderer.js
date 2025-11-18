import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

/**
 * Hook to render Mermaid diagrams (mind maps, flowcharts, etc.)
 * @param {string} mindMapCode - Raw Mermaid code (may contain ```mermaid ``` markers)
 * @returns {object} { isRendering, error, svgElement }
 */
export const useMermaidRenderer = (mindMapCode) => {
  const containerRef = useRef(null)
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState(null)
  const [svgElement, setSvgElement] = useState(null)

  useEffect(() => {
    if (!mindMapCode || !containerRef.current) {
      return
    }

    setIsRendering(true)
    setError(null)
    setSvgElement(null)

    try {
      // Check if the data is in JSON format (old format)
      let processedCode = mindMapCode.trim()
      
      // Handle JSON format (legacy format)
      if (processedCode.startsWith('{') && processedCode.endsWith('}')) {
        try {
          const jsonData = JSON.parse(processedCode)
          console.warn('⚠️ Found JSON format mind map, converting to Mermaid format...')
          
          // Convert JSON to Mermaid format
          if (jsonData.nodes && Array.isArray(jsonData.nodes) && jsonData.nodes.length > 0) {
            // Check if there's an explicit root node
            const rootNode = jsonData.nodes.find(n => n.id === 'root' || n.id === 'main')
            
            let mermaidCode = ''
            
            if (rootNode) {
              // Has explicit root: use it as root, others as children
              const rootLabel = rootNode.label || 'Main Topic'
              const otherNodes = jsonData.nodes.filter(n => n.id !== rootNode.id)
              
              mermaidCode = `mindmap\n  root((${rootLabel}))\n`
              
              otherNodes.forEach((node) => {
                const nodeLabel = node.label || node.id || 'Untitled'
                mermaidCode += `    ${nodeLabel}\n`
              })
            } else {
              // No explicit root: create a generic root and add all nodes as children
              // Try to infer root label from context (e.g., from meeting title or client name)
              const rootLabel = jsonData.rootLabel || jsonData.title || 'Meeting Topics'
              const allNodes = jsonData.nodes
              
              mermaidCode = `mindmap\n  root((${rootLabel}))\n`
              
              allNodes.forEach((node) => {
                const nodeLabel = node.label || node.id || 'Untitled'
                mermaidCode += `    ${nodeLabel}\n`
              })
            }
            
            processedCode = mermaidCode
            console.log('✅ Converted JSON to Mermaid format:', processedCode.substring(0, 150))
          } else {
            throw new Error('Invalid JSON structure for mind map: missing or empty nodes array')
          }
        } catch (jsonError) {
          console.error('Failed to parse JSON mind map:', jsonError)
          throw new Error('Invalid mind map format: JSON parsing failed')
        }
      } else {
        // Clean up the Mermaid syntax
        // Remove ```mermaid and ``` markers
        processedCode = processedCode
          .replace(/```mermaid\n?/g, '')
          .replace(/```\n?$/g, '')
          .trim()
      }

      // Validate that it starts with 'mindmap'
      if (!processedCode.startsWith('mindmap')) {
        throw new Error('Invalid mind map format: must start with "mindmap"')
      }

      console.log('Rendering mind map:', processedCode.substring(0, 100) + '...')

      // Ensure Mermaid is initialized
      // Mermaid 11.x uses run() instead of init()
      try {
        // Initialize Mermaid if not already initialized
        mermaid.initialize({
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: {
            htmlLabels: true,
            curve: 'basis'
          }
        })
      } catch (initError) {
        console.warn('Mermaid already initialized or initialization failed:', initError)
        // Continue anyway - mermaid might already be initialized
      }

      // Set the processed code as text content for Mermaid to render
      containerRef.current.textContent = processedCode

      // Render with Mermaid
      // Mermaid 11.x uses run() method instead of init()
      // run() returns a Promise, so we need to handle it asynchronously
      mermaid.run({
        nodes: [containerRef.current]
      }).then(() => {
        // Wait for SVG to be generated
        const svg = containerRef.current.querySelector('svg')
        if (svg) {
          // Set SVG attributes for responsive behavior
          svg.setAttribute('width', '100%')
          svg.setAttribute('height', '100%')
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

          // Dynamically scale SVG to fill parent
          setTimeout(() => {
            const bbox = svg.getBBox()
            const parent = containerRef.current
            const parentRect = parent.getBoundingClientRect()

            // Calculate scale based on height
            if (bbox.height > 0) {
              const scaleY = parentRect.height / bbox.height
              svg.style.transform = `scale(${scaleY})`
              svg.style.transformOrigin = 'top left'
            }

            setSvgElement(svg)
            setIsRendering(false)
            console.log('Mind map rendered successfully')
          }, 0)
        } else {
          throw new Error('Failed to render mind map: No SVG generated')
        }
      }).catch((runError) => {
        console.error('Mermaid run error:', runError)
        // Fallback: try using init() for older API compatibility
        try {
          if (typeof mermaid.init === 'function') {
            mermaid.init(undefined, containerRef.current)
            const svg = containerRef.current.querySelector('svg')
            if (svg) {
              svg.setAttribute('width', '100%')
              svg.setAttribute('height', '100%')
              svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
              setSvgElement(svg)
              setIsRendering(false)
              console.log('Mind map rendered successfully (using init fallback)')
            } else {
              throw new Error('Failed to render mind map: No SVG generated (fallback)')
            }
          } else {
            throw runError
          }
        } catch (fallbackError) {
          console.error('Mermaid fallback also failed:', fallbackError)
          setError(fallbackError.message || 'Failed to render mind map')
          setIsRendering(false)
        }
      })
    } catch (err) {
      console.error('Mermaid render error:', err)
      setError(err.message || 'Failed to render mind map')
      setIsRendering(false)
    }
  }, [mindMapCode])

  return {
    containerRef,
    isRendering,
    error,
    svgElement
  }
}
