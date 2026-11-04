// Optional links the booking page can show once you have them.
// Leave a value empty ("") and that button stays hidden.
window.ECHOCRAFT = {
  // A scheduling page, for example a Cal.com or Google Calendar appointment page.
  schedulerUrl: "",
  schedulerLabel: "Pick a date",
  // A payment link for the retainer, for example Stripe, Square, PayPal, or Pixieset.
  paymentUrl: "",
  paymentLabel: "Pay your retainer",

  // Holiday mini session dates. Each one becomes a choice in the dropdown on mini-sessions.html.
  //   date:  the day, as YYYY-MM-DD. The choice disappears by itself after that day has passed.
  //   label: what visitors read in the dropdown.
  // To take a date away (for example when it fills up), delete its line. To add one, copy a line.
  // Leave the list empty ([]) and the dropdown stays hidden, and the page says no dates are open.
  holidayMinis: [
    { date: "2026-11-18", label: "Wednesday, November 18 \u00b7 10:00 AM to 2:00 PM" },
    { date: "2026-11-25", label: "Wednesday, November 25 \u00b7 10:00 AM to 2:00 PM" },
    { date: "2026-11-28", label: "Saturday, November 28 \u00b7 4:00 PM to 5:00 PM" },
    { date: "2026-11-29", label: "Sunday, November 29 \u00b7 4:00 PM to 5:00 PM" },
    { date: "2026-12-05", label: "Saturday, December 5 \u00b7 10:00 AM to 2:00 PM" },
    { date: "2026-12-06", label: "Sunday, December 6 \u00b7 10:00 AM to 2:00 PM" },
    { date: "2026-12-12", label: "Saturday, December 12 \u00b7 10:00 AM to 2:00 PM" },
    { date: "2026-12-13", label: "Sunday, December 13 \u00b7 10:00 AM to 2:00 PM" }
  ]
};
