import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Facebook, Instagram, Linkedin, Youtube, Twitter } from "lucide-react";

export const SocialLinks = () => {
  const [socialUrls, setSocialUrls] = useState({
    instagram: "",
    facebook: "",
    linkedin: "",
    youtube: "",
    twitter: "",
  });

  useEffect(() => {
    fetchSocialUrls();
  }, []);

  const fetchSocialUrls = async () => {
    const { data } = await supabase
      .from("configuracoes_site")
      .select("chave, valor")
      .in("chave", ["instagram_url", "facebook_url", "linkedin_url", "youtube_url", "twitter_url"]);

    if (data) {
      const urls: any = {};
      data.forEach((config) => {
        const key = config.chave.replace("_url", "");
        urls[key] = config.valor || "";
      });
      setSocialUrls(urls);
    }
  };

  const socialLinks = [
    { icon: Instagram, url: socialUrls.instagram, name: "Instagram" },
    { icon: Facebook, url: socialUrls.facebook, name: "Facebook" },
    { icon: Linkedin, url: socialUrls.linkedin, name: "LinkedIn" },
    { icon: Youtube, url: socialUrls.youtube, name: "YouTube" },
    { icon: Twitter, url: socialUrls.twitter, name: "Twitter" },
  ];

  const activeSocialLinks = socialLinks.filter((link) => link.url);

  if (activeSocialLinks.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      {activeSocialLinks.map(({ icon: Icon, url, name }) => (
        <a
          key={name}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label={name}
        >
          <Icon className="h-5 w-5" />
        </a>
      ))}
    </div>
  );
};
