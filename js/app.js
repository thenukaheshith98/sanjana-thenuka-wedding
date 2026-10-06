const WEDDING = {
  start: new Date("2026-12-03T10:45:00+05:30"),
  end: new Date("2026-12-03T14:00:00+05:30"),
  title: "Wedding of Sanjana & Thenuka",
  location: "Paradise in Bolgoda, 67 Meegahawatte Rd, Piliyandala 10300, Sri Lanka",
  details:
    "Ring Ceremony — 10.45 AM\nRegistration — 11.00 AM\nParadise in Bolgoda",
};

const pad = (n) => String(n).padStart(2, "0");

function remaining(from, to) {
  const diff = Math.max(0, to.getTime() - from.getTime());
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: diff === 0,
  };
}

function tickCountdown() {
  const parts = remaining(new Date(), WEDDING.start);
  const map = {
    days: parts.days,
    hours: parts.hours,
    minutes: parts.minutes,
    seconds: parts.seconds,
  };
  Object.entries(map).forEach(([key, value]) => {
    document.querySelectorAll(`[data-count="${key}"]`).forEach((el) => {
      el.textContent = pad(value);
    });
  });
}

function icsStamp(date) {
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const h = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const s = pad(date.getUTCSeconds());
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

function buildIcs() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sanjana and Thenuka//Wedding//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:sanjana-thenuka-wedding-${icsStamp(WEDDING.start)}@invitation`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(WEDDING.start)}`,
    `DTEND:${icsStamp(WEDDING.end)}`,
    `SUMMARY:${WEDDING.title}`,
    `LOCATION:${WEDDING.location}`,
    `DESCRIPTION:${WEDDING.details.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return ics;
}

function downloadIcs() {
  const blob = new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sanjana-thenuka-wedding.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function googleCalUrl() {
  const dates = `${icsStamp(WEDDING.start)}/${icsStamp(WEDDING.end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: WEDDING.title,
    dates,
    details: WEDDING.details,
    location: WEDDING.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function outlookUrl() {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: WEDDING.title,
    startdt: WEDDING.start.toISOString(),
    enddt: WEDDING.end.toISOString(),
    body: WEDDING.details,
    location: WEDDING.location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function setupCalendar() {
  const root = document.querySelector("[data-calendar]");
  if (!root) return;
  const toggle = root.querySelector("[data-calendar-toggle]");
  const google = root.querySelector("[data-cal-google]");
  const outlook = root.querySelector("[data-cal-outlook]");
  const apple = root.querySelector("[data-cal-apple]");
  const ics = root.querySelector("[data-cal-ics]");

  if (google) google.href = googleCalUrl();
  if (outlook) outlook.href = outlookUrl();

  const close = () => {
    root.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
  };

  toggle?.addEventListener("click", () => {
    const open = !root.classList.contains("is-open");
    root.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  apple?.addEventListener("click", downloadIcs);
  ics?.addEventListener("click", downloadIcs);

  document.addEventListener("click", (e) => {
    if (!root.contains(e.target)) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function setupMusic() {
  const audio = document.querySelector("[data-audio]");
  const buttons = document.querySelectorAll("[data-music]");
  if (!audio) return;

  const setState = (playing) => {
    buttons.forEach((btn) => {
      btn.classList.toggle("is-playing", playing);
      btn.setAttribute("aria-label", playing ? "Turn music off" : "Turn music on");
      btn.setAttribute("title", playing ? "Turn music off" : "Turn music on");
    });
  };

  const play = async () => {
    try {
      audio.volume = 0.55;
      await audio.play();
      setState(true);
    } catch {
      setState(false);
    }
  };

  const pause = () => {
    audio.pause();
    setState(false);
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (audio.paused) play();
      else pause();
    });
  });

  audio.addEventListener("ended", () => setState(false));
  return { play, pause, audio };
}

function setupCover(music) {
  const cover = document.querySelector("[data-cover]");
  const openBtn = document.querySelector("[data-open]");
  if (!cover || !openBtn) return;

  const open = () => {
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-open");
    cover.classList.add("is-gone");
    cover.setAttribute("aria-hidden", "true");
    music?.play();
    window.setTimeout(() => {
      cover.hidden = true;
    }, 700);
  };

  openBtn.addEventListener("click", open);
}

function setupNav() {
  const links = document.querySelectorAll(".dock a[href^='#']");
  const sections = [...links]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActive(visible.target.id);
    },
    { rootMargin: "-35% 0px -50% 0px", threshold: [0.2, 0.4, 0.6] }
  );

  sections.forEach((section) => observer.observe(section));
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("is-locked");
  tickCountdown();
  window.setInterval(tickCountdown, 1000);
  setupCalendar();
  const music = setupMusic();
  setupCover(music);
  setupNav();
});
