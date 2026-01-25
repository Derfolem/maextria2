import { Share2 } from "lucide-react";
import { Button } from "./ui/button";

interface ShareButtonProps {
  title: string;
  url?: string;
}

export const ShareButton = ({ title, url }: ShareButtonProps) => {
  const handleShare = () => {
    const shareUrl = url || window.location.href;
    const text = `Confira o curso: ${title}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`;
    
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-2"
    >
      <Share2 className="h-4 w-4" />
      Compartilhar
    </Button>
  );
};
