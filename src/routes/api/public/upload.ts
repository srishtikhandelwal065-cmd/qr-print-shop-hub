import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/upload")({
  server: { handlers: { POST: async ({ request }) => {
    const { receivePrintUpload } = await import("@/lib/customer-upload.server");
    return receivePrintUpload(request);
  } } },
});