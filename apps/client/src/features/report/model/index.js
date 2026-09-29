import { api } from "@/lib/api";

export async function downloadProjectReport(projectId) {
  const response = await api.get(`reports/projects/${projectId}`, {
    responseType: "blob",
  });
  const objectUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `rapport-${projectId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}
