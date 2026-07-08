"use client";
import { useEffect, useState } from "react";
export function useMounted(){const[m,setM]=useState(false);useEffect(()=>{const id=window.setTimeout(()=>setM(true),0);return()=>window.clearTimeout(id)},[]);return m}
