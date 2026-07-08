export type Status = "draft" | "published" | "review" | "archived";
export type CatalogItem = { id:string; title:string; type:string; category:string; tags:string[]; description:string; status:Status; premium:boolean; featured:boolean; thumbnailStyle:string; motionPreset:string; createdAt:string; updatedAt:string };
export type MotionPreset = { id:string; title:string; icon:string; token:string; duration:number; easing:string; description:string };
