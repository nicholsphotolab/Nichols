import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import RootLayout from "./RootLayout";
import NotFoundPage from "./NotFoundPage";
import { getRouteMeta } from "./routeMeta";
import { useScrollRestoration } from "@/lib/useScrollRestoration";
import Home from "@/home/HomePage";
import FilmPage from "@/film/FilmPage";
import FilmStockPage from "@/film/FilmStockPage";
import VideoPage from "@/video/VideoPage";
import VideoCategoryPage from "@/video/VideoCategoryPage";
import QuotePage from "@/quote/QuotePage";
import FaqPage from "@/faq/FaqPage";
import PassportPage from "@/passport/PassportPage";

// Keeps <title>/<meta name="description"> correct across client-side
// navigation. The prerendered HTML already has the right ones baked in by
// entry-server.tsx for the first load; this covers every navigation after
// that, the same way Next updated them per page.
function RouteMeta() {
  const location = useLocation();
  useEffect(() => {
    const meta = getRouteMeta(location.pathname);
    document.title = meta.title;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", meta.description);
  }, [location.pathname]);
  return null;
}

// Top of the page on a new page, back to the same spot on Back / Forward —
// see useScrollRestoration.
function ScrollManager() {
  useScrollRestoration();
  return null;
}

export default function App() {
  return (
    <RootLayout>
      <RouteMeta />
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/film" element={<FilmPage />} />
        <Route path="/film/:stock" element={<FilmStockPage />} />
        <Route path="/video" element={<VideoPage />} />
        <Route path="/video/:category" element={<VideoCategoryPage />} />
        <Route path="/quote" element={<QuotePage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/passport" element={<PassportPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RootLayout>
  );
}
