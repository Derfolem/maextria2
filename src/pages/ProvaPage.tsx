import { useParams } from "react-router-dom";
export default function ProvaPage() {
  const { slug } = useParams();
  return <div className="p-6">Prova do curso: {slug} (em breve)</div>;
}
