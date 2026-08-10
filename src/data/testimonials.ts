export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  text: string;
  treatment: string;
  avatar: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "مريم أحمد",
    rating: 5,
    text: "الدكتور شرحلي كل حاجة كويس وكنت مرتاحة. العيادة نضيفة والتعقيم واضح.",
    treatment: "زراعة الأسنان",
    avatar: "م",
  },
  {
    id: "t2",
    name: "محمد حسن",
    rating: 5,
    text: "حجزت من الواتساب ورد عليا بسرعة. الدكتور كويس ومحسيتش بألم يُذكر.",
    treatment: "علاج جذور",
    avatar: "م",
  },
  {
    id: "t3",
    name: "نور إبراهيم",
    rating: 4,
    text: "عملت تقويم والدكتورة بتتابع معايا باستمرار. مبسوطة من النتيجة لحد دلوقتي.",
    treatment: "تقويم الأسنان",
    avatar: "ن",
  },
  {
    id: "t4",
    name: "أحمد سعيد",
    rating: 5,
    text: "المكان نضيف والتعامل محترم. عملت هوليوود سمايل والنتيجة عجبتني.",
    treatment: "هوليوود سمايل",
    avatar: "أ",
  },
  {
    id: "t5",
    name: "فاطمة علي",
    rating: 5,
    text: "جبت ابني الصغير وكان خايف في الأول، بس الدكتور تعامل معاه كويس واطمن.",
    treatment: "طب أسنان الأطفال",
    avatar: "ف",
  },
  {
    id: "t6",
    name: "عمر طارق",
    rating: 4,
    text: "عملت تبييض والسعر كان معقول. النتيجة حلوة والفرق واضح.",
    treatment: "تبييض الأسنان",
    avatar: "ع",
  },
];
