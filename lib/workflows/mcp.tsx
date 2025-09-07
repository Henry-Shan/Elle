
/** @jsxImportSource @gensx/core */
import * as gensx from "@gensx/core"

interface McpProps {
    message: string
}

interface McpResult {
    response: string
}

async function Mcp(props: McpProps) {
    return {
        response: `Hello from MCP! Your message was: ${props.message}`
    }
}
const McpComponent = gensx.Component<McpProps, McpResult>('mcp', Mcp)
const McpWorkflow = gensx.Workflow('MCP Tool', McpComponent)

export default McpWorkflow; 