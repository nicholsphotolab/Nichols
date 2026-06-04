export type FaqItem = { q: string; a: string };
export type FaqSection = { heading: string; items: FaqItem[] };

export const FAQ_SECTIONS: FaqSection[] = [
  {
    heading: "Film Processing",
    items: [
      {
        q: "What film formats do you process?",
        a: "We develop 35mm, 110, 120, and sheet film up to 8×10. All three chemistry types — C‑41, black-and-white, and E‑6 — are processed entirely in-house.",
      },
      {
        q: "How long does development take?",
        a: "Standard turnaround is 1–3 business days. Turnaround can vary with volume, so call us at 801-486-3053 for the most current estimate before dropping off.",
      },
      {
        q: "Do you offer push/pull processing?",
        a: "Yes. Push and pull are available on request for any chemistry. Just let us know the number of stops when you drop off your film.",
      },
      {
        q: "Can I get scans with my development?",
        a: "Yes — we offer scanning alongside development. Ask about our scan options and resolution levels when you drop off.",
      },
      {
        q: "Can I mail in my film?",
        a: "Yes, we accept mail-in film orders. Call us at 801-486-3053 and we'll walk you through packaging and shipping instructions before you send anything.",
      },
    ],
  },
  {
    heading: "Prints & Orders",
    items: [
      {
        q: "What's the largest print you offer?",
        a: "We print up to 60×96 inches on our wide-format printers.",
      },
      {
        q: "What paper and finish options are available?",
        a: "Our standard paper is Fuji Professional Luster. Additional finishes are available — ask at the counter when you place your order.",
      },
      {
        q: "How do I submit files for printing?",
        a: "Bring a USB drive or memory card, or email your files ahead of time. For large orders, call us first so we can make sure your files are set up correctly.",
      },
      {
        q: "Do you offer mounting and framing?",
        a: "Yes. We mount on foam board, gatorfoam, or masonite, and frame prints in-house. Bring your print — or have us make one — and we'll handle the rest.",
      },
      {
        q: "Can I order prints directly from my negatives or scans?",
        a: "Absolutely. We develop, scan, and print in-house, so the whole workflow can stay with us from a single drop-off.",
      },
    ],
  },
  {
    heading: "Passport Photos",
    items: [
      {
        q: "Do I need an appointment for passport photos?",
        a: "No appointment needed. Walk-ins are welcome during passport photo hours: Monday–Friday, 9AM–4PM.",
      },
      {
        q: "Which countries' passports do you support?",
        a: "We shoot US passports and most international passports, including Canada, Australia, the Netherlands, and many others. Call ahead if you're unsure about your specific country.",
      },
      {
        q: "How quickly will my photos be ready?",
        a: "Passport photos are typically printed and ready within minutes of your session.",
      },
      {
        q: "What should I wear?",
        a: "Wear everyday clothing. Avoid solid white tops — they can blend into the background. Hats and sunglasses are not permitted unless worn for religious or medical reasons.",
      },
      {
        q: "How much do passport photos cost?",
        a: "Call us at 801-486-3053 for current pricing.",
      },
    ],
  },
  {
    heading: "General",
    items: [
      {
        q: "Where are you located?",
        a: "We're at 3265 South 1100 East, Salt Lake City, UT 84106.",
      },
      {
        q: "What are your hours?",
        a: "Monday–Friday, 9AM–5PM. Passport photo hours are 9AM–4PM. We are closed on weekends and major holidays.",
      },
      {
        q: "Do you ship finished orders?",
        a: "We primarily serve walk-in customers and accept mail-in film. Call us at 801-486-3053 to discuss shipping options for your specific order.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept cash, check, and major credit cards. Call ahead if you have questions about payment for a specific service.",
      },
      {
        q: "Can I order prints without visiting in person?",
        a: "Yes. You can email your files and arrange payment by phone. Call us at 801-486-3053 to set up a remote order.",
      },
    ],
  },
];
