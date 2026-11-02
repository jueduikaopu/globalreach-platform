export const locales=['en','es','ru','ja','de','fr','pt','ar'];
const dictionary={
  en:{collection:'Featured products',story:'Designed with purpose',contact:'Let’s stay in touch',cta:'Explore collection'},
  es:{collection:'Productos destacados',story:'Diseñado con propósito',contact:'Sigamos en contacto',cta:'Explorar colección'},
  ru:{collection:'Популярные товары',story:'Создано со смыслом',contact:'Оставайтесь с нами',cta:'Смотреть коллекцию'},
  ja:{collection:'おすすめ商品',story:'目的あるデザイン',contact:'最新情報を受け取る',cta:'コレクションを見る'},
  de:{collection:'Ausgewählte Produkte',story:'Mit Sinn gestaltet',contact:'Bleiben wir in Kontakt',cta:'Kollektion entdecken'},
  fr:{collection:'Produits en vedette',story:'Conçu avec intention',contact:'Restons en contact',cta:'Découvrir la collection'},
  pt:{collection:'Produtos em destaque',story:'Design com propósito',contact:'Mantenha contato',cta:'Explorar coleção'},
  ar:{collection:'منتجات مختارة',story:'تصميم هادف',contact:'لنبقَ على تواصل',cta:'استكشف المجموعة'}
};
export const translate=(key,locale='en')=>dictionary[locale]?.[key]||dictionary.en[key]||key;
