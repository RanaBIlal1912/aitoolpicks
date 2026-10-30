// Real photographs from Unsplash (Unsplash License: free for commercial use, no permission needed, credit appreciated).
// Each file was downloaded from its original photo page, resized and saved as WebP. docs/IMAGE_ASSETS.md records the source,
// photographer, licence and download date of every file. These are stock photographs, never product screenshots, and are labelled so.
export type PhotoId =
  | "server-aisle" | "datacenter-white" | "circuit-blue" | "circuit-macro" | "silicon-wafer" | "processor-tweezers" | "fibre-switch"
  | "light-dark-room" | "laptop-desk" | "office-glass" | "data-presentation" | "cable-network" | "architecture-ribs"
  | "notebook-pen" | "camera-lens" | "microphone" | "code-screen" | "whiteboard" | "analytics-laptop" | "colour-swatches" | "library-study"
  | "padlock-laptop" | "robot-arm" | "marketing-strategy" | "microscope-lab" | "city-night" | "headphones-keys";

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
  "notebook-pen": { alt: "A black pen on a lined spiral notebook", by: "Justin Morgan", page: "https://unsplash.com/photos/Hx-4TbpsoIw" },
  "camera-lens": { alt: "A video camera with a zoom lens on a tripod against blue and pink light", by: "Sirisvisual", page: "https://unsplash.com/photos/IcwAKUhNGXs" },
  microphone: { alt: "A condenser microphone beside a pop filter, in black and white", by: "Leo Wieling", page: "https://unsplash.com/photos/bG8U3kaZltE" },
  "code-screen": { alt: "Lines of code on a computer screen", by: "Chris Ried", page: "https://unsplash.com/photos/ieic5Tq8YMk" },
  whiteboard: { alt: "Two people sketching ideas on a whiteboard", by: "Kaleidico", page: "https://unsplash.com/photos/26MJGnCM0Wc" },
  "analytics-laptop": { alt: "Graphs of performance analytics on a laptop screen", by: "Luke Chesser", page: "https://unsplash.com/photos/JKUTrJ4vK00" },
  "colour-swatches": { alt: "A colour code book and design swatches on a desk", by: "Balázs Kétyi", page: "https://unsplash.com/photos/LPWl2pEVGKc" },
  "library-study": { alt: "A student studying at a laptop in a quiet library", by: "Zoshua Colah", page: "https://unsplash.com/photos/X4MKvus3QX4" },
  "padlock-laptop": { alt: "A padlock on a laptop keyboard with coloured light trails", by: "FlyD", page: "https://unsplash.com/photos/C5pXRFEjq3w" },
  "robot-arm": { alt: "A blue industrial robot arm in a factory", by: "Homa Appliances", page: "https://unsplash.com/photos/sz1CHL7Pky0" },
  "marketing-strategy": { alt: "Paper reading Marketing Strategy on a wooden desk beside a marketing book", by: "Campaign Creators", page: "https://unsplash.com/photos/yktK2qaiVHI" },
  "microscope-lab": { alt: "A laboratory workbench with a microscope and equipment", by: "Trnava University", page: "https://unsplash.com/photos/_9xRHrMOjeg" },
  "city-night": { alt: "A city skyline at night across the water", by: "Diane Picchiottino", page: "https://unsplash.com/photos/EZ_SHxykcgw" },
  "headphones-keys": { alt: "Headphones resting on a music production keyboard in front of a screen", by: "Dima Zimakov", page: "https://unsplash.com/photos/wUcXPyX56Ug" },
};

export const PHOTO_SIZES = { full: { w: 1920 }, sm: { w: 640 } } as const;
export const photoPath = (id: PhotoId, size: "full" | "sm" = "full") => `/images/photo/${id}${size === "sm" ? "-sm" : ""}.webp`;

/** Picks one photo from a pool, the same one every time for the same seed (a slug), so neighbouring articles do not all share one image. */
export function pickPhoto(pool: PhotoId[], seed: string): PhotoId {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}
