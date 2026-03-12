# Shed Textures

Optional PBR texture files for higher realism. The app uses procedural fallbacks if these are not present.

## Expected files (place in `public/textures/`)

| File | Use |
|------|-----|
| `wood_diffuse.jpg` | Wood grain for walls, studs, framing |
| `wood_normal.jpg` | Normal map for wood |
| `wood_roughness.jpg` | Roughness map for wood |
| `roof_felt.jpg` | Roofing felt or shingles |
| `osb.jpg` | OSB floor texture |
| `grass.jpg` | Ground/grass texture |

Load via drei's `useTexture` and pass to materials. The current implementation uses procedural textures from `useShedTextures`.
