/**
 * Pexels fallback images for categories.
 * Used when the backend category has no image.
 * Source: cs_home_category_styles reference project.
 */
const px = (id: number, ext: 'jpeg' | 'png' = 'jpeg') =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.${ext}?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940`

export const categoryImages: Record<string, string> = {
  'fruits-vegetables': px(11669641),
  'meat-poultry': px(38487454),
  'bakery': px(30826792),
  'dairy-eggs': px(8964018),
  'beverages': px(34034733),
  'snacks-treats': px(19601414, 'png'),
  'pantry-staples': px(9898345),
  'frozen-foods': px(16962446),
  'household': px(5217900),
  'baby-toddler': px(6849268),
  'health-beauty': px(4202328),
  'wines-spirits': px(13257037),
  'pet-supplies': px(8434633),
  'ready-meals-deli': px(35290638),
  'stationery-school': px(5594313),
}

export const categoryAccents: Record<string, string> = {
  'fruits-vegetables': '#557D3F',
  'meat-poultry': '#A6402E',
  'bakery': '#B98336',
  'dairy-eggs': '#A98F55',
  'beverages': '#CE8F2E',
  'snacks-treats': '#B25C33',
  'pantry-staples': '#8A6B45',
  'frozen-foods': '#5E7F9E',
  'household': '#5F7D6D',
  'baby-toddler': '#C58E86',
  'health-beauty': '#A9707F',
  'wines-spirits': '#7C4B58',
  'pet-supplies': '#A97E42',
  'ready-meals-deli': '#BF4B3C',
  'stationery-school': '#54708F',
}
