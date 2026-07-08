export const duration = { instant:80, fast:120, base:180, smooth:240, panel:320, section:420, page:480, hero:700, ambient:2400 } as const;
export const ease = { standard:"cubic-bezier(0.22, 1, 0.36, 1)", soft:"cubic-bezier(0.16, 1, 0.3, 1)", sharp:"cubic-bezier(0.4, 0, 0.2, 1)", expo:"cubic-bezier(0.19, 1, 0.22, 1)" } as const;
export const spring = { default:{stiffness:260,damping:24}, heavy:{stiffness:180,damping:30}, soft:{stiffness:160,damping:22} } as const;
