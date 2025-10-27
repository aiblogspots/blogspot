
export interface Source {
  uri: string;
  title: string;
}

export interface PostImage {
  src: string;
  alt: string;
}

export interface Post {
  title: string;
  subtitle: string;
  content: string;
  sources?: Source[];
  images: PostImage[];
  // Pro features
  metaDescription: string;
  seoKeywords: string[];
  // Internal use for generation flow
  imageAltTexts?: string[];
}
