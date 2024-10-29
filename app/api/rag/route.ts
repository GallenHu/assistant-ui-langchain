import "cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/ollama";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const chatModel = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_API_BASE,
    apiKey: process.env.OPENAI_API_KEY,
  },
});

const embeddings = new OllamaEmbeddings({
  model: "shaw/dmeta-embedding-zh", // ollama pull shaw/dmeta-embedding-zh
  baseUrl: "http://127.0.0.1:11434", // Ollama default value
});

let vectorStore: any;

async function init() {
  console.log("init vectorStore...");

  const nike10kPdfPath = "./test.pdf";
  // PDF loader
  const loader = new PDFLoader(nike10kPdfPath);
  const docs = await loader.load(); // array of Document objects

  // build vectorStore
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 0,
  });
  const allSplits = await textSplitter.splitDocuments(docs);

  const vectorStore = await MemoryVectorStore.fromDocuments(
    allSplits,
    embeddings
  );

  return vectorStore;
}

init().then((s) => {
  vectorStore = s;
  console.log("vectorStore init success");
});

export async function POST(req: Request) {
  const { question } = await req.json();

  if (!vectorStore) {
    return new NextResponse(JSON.stringify({ error: "vectorStore 未初始化" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // web loader
  // const loader = new CheerioWebBaseLoader(
  //   "https://hgl2.com/2023/install-mosdns-in-macos/"
  // );
  // const docs = await loader.load();

  const context = await vectorStore.similaritySearch(question);

  const prompt = PromptTemplate.fromTemplate(
    "根据这些找到的文档回答问题:\n 文档： {context} \n 问题： {question}"
  );
  const chain = await createStuffDocumentsChain({
    llm: chatModel,
    outputParser: new StringOutputParser(),
    prompt,
  });
  console.log("context:\n");
  console.log(context);

  const res = await chain.invoke({
    context: context,
    question: question,
  });

  console.log("res:\n");
  console.log(res);

  return new NextResponse(JSON.stringify({ success: res }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
