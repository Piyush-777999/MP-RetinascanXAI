// src/apiConfig.js — Centralized backend API and media URL configuration
// Configures local fallback (http://localhost:8000) and production cloud API URL via VITE_API_URL

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Resolves a full URL for an image returned by the server.
 * Handles relative paths (e.g. '/images/heatmap_live_xyz.png') by prepending API_BASE_URL,
 * while preserving existing absolute URLs (http, https, blob, data).
 */
export function getFullImageUrl(url) {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
}
