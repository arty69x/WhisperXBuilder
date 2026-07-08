"use client";
import { useEffect, useState } from "react";
export function useReducedMotion(){const[reduced,setReduced]=useState(false);useEffect(()=>{const m=matchMedia("(prefers-reduced-motion: reduce)");const f=()=>setReduced(m.matches);f();m.addEventListener("change",f);return()=>m.removeEventListener("change",f)},[]);return reduced}
