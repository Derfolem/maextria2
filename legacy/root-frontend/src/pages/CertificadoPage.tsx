import { useParams } from "react-router-dom";
export default function CertificadoPage() {
  const { slug } = useParams();
  return <div className="p-6">Certificado do curso: {slug} (em breve)</div>;
}
