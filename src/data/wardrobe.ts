/**
 * Vestuario: piezas de ropa del explorador. Algunas se ganan con logros (cero azar).
 */
export type Category = 'hat' | 'shirt' | 'pants' | 'shoes' | 'bag' | 'skin' | 'hair';

export interface WardrobeItem {
  id: string;
  name: string;
  color: number; // color principal (también se usa en la miniatura)
  unlock?: string; // id de logro necesario
}

export interface Outfit {
  hat: string;
  shirt: string;
  pants: string;
  shoes: string;
  bag: string;
  skin: string;
  hair: string;
}

export const CATEGORIES: { id: Category; name: string }[] = [
  { id: 'hat', name: 'Cabeza' },
  { id: 'shirt', name: 'Camisa' },
  { id: 'pants', name: 'Pantalón' },
  { id: 'shoes', name: 'Zapatos' },
  { id: 'bag', name: 'Mochila' },
  { id: 'skin', name: 'Piel' },
  { id: 'hair', name: 'Pelo' },
];

export const WARDROBE: Record<Category, WardrobeItem[]> = {
  hat: [
    { id: 'ninguno', name: 'Sin nada', color: 0xe2e8f0 },
    { id: 'gorra', name: 'Gorra', color: 0x0ea5e9 },
    { id: 'gorro', name: 'Gorro', color: 0xf43f5e },
    { id: 'casco', name: 'Casco', color: 0xfacc15, unlock: 'sismo' },
    { id: 'pintao', name: 'Sombrero pintao', color: 0xf5f0e1, unlock: 'certero' },
  ],
  shirt: [
    { id: 'cielo', name: 'Cielo', color: 0x0ea5e9 },
    { id: 'coral', name: 'Coral', color: 0xfb7185 },
    { id: 'verde', name: 'Verde', color: 0x22c55e },
    { id: 'sol', name: 'Sol', color: 0xfacc15 },
    { id: 'morado', name: 'Morado', color: 0xa78bfa },
    { id: 'chaleco', name: 'Chaleco reflectivo', color: 0xf97316, unlock: 'incendio' },
  ],
  pants: [
    { id: 'gris', name: 'Gris', color: 0x475569 },
    { id: 'jean', name: 'Jean', color: 0x1d4ed8 },
    { id: 'cafe', name: 'Café', color: 0x92400e },
    { id: 'verde', name: 'Verde', color: 0x15803d },
  ],
  shoes: [
    { id: 'blancos', name: 'Blancos', color: 0xf8fafc },
    { id: 'negros', name: 'Negros', color: 0x1e293b },
    { id: 'rojos', name: 'Rojos', color: 0xdc2626 },
    { id: 'botas', name: 'Botas de lluvia', color: 0xfacc15, unlock: 'inundacion' },
  ],
  bag: [
    { id: 'ninguna', name: 'Sin mochila', color: 0xe2e8f0 },
    { id: 'mochila', name: 'Mochila', color: 0xf59e0b },
    { id: 'azul', name: 'Mochila azul', color: 0x2563eb },
    { id: 'kit', name: 'Kit de emergencia', color: 0xdc2626, unlock: 'tormenta' },
  ],
  skin: [
    { id: 'p1', name: 'Tono 1', color: 0xf8d5b8 },
    { id: 'p2', name: 'Tono 2', color: 0xe0ac7e },
    { id: 'p3', name: 'Tono 3', color: 0xb97a4f },
    { id: 'p4', name: 'Tono 4', color: 0x7a4a2c },
  ],
  hair: [
    { id: 'negro', name: 'Negro', color: 0x1f1a17 },
    { id: 'cafe', name: 'Café', color: 0x5b3a22 },
    { id: 'rubio', name: 'Rubio', color: 0xd6a85c },
    { id: 'rojo', name: 'Rojizo', color: 0x9a3412 },
  ],
};

export const DEFAULT_OUTFIT: Outfit = { hat: 'ninguno', shirt: 'cielo', pants: 'gris', shoes: 'blancos', bag: 'mochila', skin: 'p2', hair: 'cafe' };

export const itemOf = (cat: Category, id: string) => WARDROBE[cat].find((i) => i.id === id) ?? WARDROBE[cat][0];
