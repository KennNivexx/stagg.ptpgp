import { getDocumentsData } from "@/app/actions/infrastructure";
import DocumentsClient from "./DocumentsClient";

export default async function DokumenPerusahaanPage() {
  const documents = await getDocumentsData();

  return <DocumentsClient initialDocuments={documents} />;
}
