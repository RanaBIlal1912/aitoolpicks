// Real photographs from Unsplash (Unsplash License: free for commercial use, no permission needed, credit appreciated).
// Each file was downloaded from its original photo page, resized and saved as WebP. docs/IMAGE_ASSETS.md records the source,
// photographer, licence and download date of every file. These are stock photographs, never product screenshots, and are labelled so.
export type PhotoId =
  | "server-aisle" | "datacenter-white" | "circuit-blue" | "circuit-macro" | "silicon-wafer" | "processor-tweezers" | "fibre-switch"
  | "light-dark-room" | "laptop-desk" | "office-glass" | "data-presentation" | "cable-network" | "architecture-ribs";

export const PHOTOS: Record<PhotoId, { alt: string; by: string; page: string }> = {
  "server-aisle": { alt: "Aisle between tall server racks in a data centre", by: "İsmail Enes Ayhan", page: "https://unsplash.com/photos/lVZjvw-u9V8" },
  "datacenter-white": { alt: "Rows of white server cabinets under black ceiling rails in a data centre", by: "Tony Marinescu", page: "https://unsplash.com/photos/fImCPTZ026U" },
  "circuit-blue": { alt: "Close-up of a blue circuit board with chips and components", by: "Umberto", page: "https://unsplash.com/photos/jXd2FSvcRr8" },
  "circuit-macro": { alt: "Macro photograph of a dark circuit board with chips", by: "Alexandre Debiève", page: "https://unsplash.com/photos/FO7JIlwjOtU" },
  "silicon-wafer": { alt: "Iridescent silicon wafer with a grid of microchips", by: "Laura Ockel", page: "https://unsplash.com/photos/qOx9KsvpqcM" },
  "processor-tweezers": { alt: "A computer processor held upright by tweezers", by: "Brian Kostiuk", page: "https://unsplash.com/photos/S4jSvcHYcOs" },
  "fibre-switch": { alt: "Fibre optic cables plugged into a network switch", by: "Kirill Sh", page: "https://unsplash.com/photos/eVWWr6nmDf8" },
  "light-dark-room": { alt: "Strands of fibre optic light glowing blue in a dark room", by: "Denny Müller", page: "https://unsplash.com/photos/JyRTi3LoQnc" },
  "laptop-desk": { alt: "A laptop and mouse on a wooden desk", by: "Kari Shea", page: "https://unsplash.com/photos/vGgaESc2M1Y" },
  "office-glass": { alt: "Bright modern office with glass walls and plants", by: "Caroline Badran", page: "https://unsplash.com/photos/B74lBYC3PXI" },
  "data-presentation": { alt: "A man presenting charts on a large screen to colleagues", by: "Vitaly Gariev", page: "https://unsplash.com/photos/6CfjB_bQ_FY" },
  "cable-network": { alt: "Network cabinet with cables in a server room", by: "Taylor Vick", page: "https://unsplash.com/photos/M5tzZtFCOfs" },
  "architecture-ribs": { alt: "Curved white architectural ribs", by: "Erik Eastman", page: "https://unsplash.com/photos/6zFVL4YuaM" },
};

export const PHOTO_SIZES = { full: { w: 1920 }, sm: { w: 640 } } as const;
export const photoPath = (id: PhotoId, size: "full" | "sm" = "full") => `/images/photo/${id}${size === "sm" ? "-sm" : ""}.webp`;
