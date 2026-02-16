
/** @jsxImportSource @gensx/core */
import * as gensx from "@gensx/core"
import { GenerateText } from "@gensx/vercel-ai-sdk"
import { deepseek } from "@ai-sdk/deepseek"
import { mistral } from "@ai-sdk/mistral"

interface SearchProps {
    usersOriginalQuery: string
    searchQuery: string
    date: string
    numberOfResults: number
}

interface SearchResult {
    result: string
}

async function WebSearch(props: SearchProps) {
    const provider = process.env.AI_PROVIDER || "deepseek";
    const languageModel = provider === "mistral" ? mistral("mistral-large-latest") : deepseek("deepseek-chat");
    const systemPrompt = `
        You are a search engine for AI news. 
        You will be given a query and you will need to search the web for the most relevant AI news for the last 24 hours based on the query. 
        Return the result as a plain text string. Keep it short and concise and provide at least 1 source url for the news.
        Listen carefully to the user's query and provide a search query that will return the most relevant result.
    `
    const prompt = `
        Search the web for the most relevant AI news for the last 24 hours. 
        User query: (${props.usersOriginalQuery})
        Search query: (${props.searchQuery})
        Current date: (${props.date})
        Number of desired results: (${props.numberOfResults})
    `
    return {
        result: <GenerateText system={systemPrompt} prompt={prompt} model={languageModel}>
            {result => {return result.text}}
        </GenerateText>
    }
}
const WebSearchComponent = gensx.Component<SearchProps, SearchResult>('webSearch', WebSearch)
const WebSearchWorkflow = gensx.Workflow('Web Search Tool', WebSearchComponent)

export default WebSearchWorkflow;