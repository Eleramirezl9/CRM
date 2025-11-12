# Iconos para PWA

## Generar iconos PNG

Necesitas crear los siguientes iconos PNG a partir del `icon.svg`:

### Iconos principales (obligatorios):
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

### Iconos adicionales (opcionales):
- `shortcut-venta.png` (96x96)
- `shortcut-inventario.png` (96x96)
- `shortcut-produccion.png` (96x96)
- `apple-touch-icon.png` (180x180)
- `favicon.ico` (32x32)

## Herramientas recomendadas:

### Opción 1: Online (más fácil)
1. **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
   - Sube `icon.svg`
   - Descarga todos los tamaños generados automáticamente

### Opción 2: Comando (si tienes ImageMagick instalado)
```bash
# Instalar ImageMagick primero
# Windows: choco install imagemagick
# macOS: brew install imagemagick
# Linux: sudo apt install imagemagick

# Generar todos los tamaños
magick icon.svg -resize 72x72 icon-72x72.png
magick icon.svg -resize 96x96 icon-96x96.png
magick icon.svg -resize 128x128 icon-128x128.png
magick icon.svg -resize 144x144 icon-144x144.png
magick icon.svg -resize 152x152 icon-152x152.png
magick icon.svg -resize 192x192.png icon-192x192.png
magick icon.svg -resize 384x384 icon-384x384.png
magick icon.svg -resize 512x512 icon-512x512.png
magick icon.svg -resize 180x180 apple-touch-icon.png
magick icon.svg -resize 32x32 favicon.ico
```

### Opción 3: Con npm (recomendado para automatización)
```bash
npm install -g pwa-asset-generator

pwa-asset-generator icon.svg ./public/icons \
  --favicon \
  --opaque false \
  --padding "10%" \
  --background "#c86d3d"
```

## Personalización

Edita `icon.svg` con tu propio diseño usando:
- Adobe Illustrator
- Figma
- Inkscape (gratis)
- https://www.figma.com

Asegúrate de mantener:
- Colores del tema (#c86d3d terracota, #fef9f3 crema)
- Diseño simple y reconocible en tamaños pequeños
- Buen contraste para visibilidad
