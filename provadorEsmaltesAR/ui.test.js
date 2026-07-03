import { beforeEach, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

describe('Risqué Virtual Try-on UI', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(html);
    document = dom.window.document;
  });

  it('should have a video element for the webcam feed', () => {
    const video = document.getElementById('webcam');
    expect(video).not.toBeNull();
    expect(video.hasAttribute('autoplay')).toBe(true);
    expect(video.hasAttribute('playsinline')).toBe(true);
  });

  it('should have an AR canvas for rendering nail polish overlays', () => {
    const canvas = document.getElementById('ar-canvas');
    expect(canvas).not.toBeNull();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('should display the loading overlay by default', () => {
    const loader = document.querySelector('.loading-overlay');
    expect(loader).not.toBeNull();
    expect(loader.textContent).toContain('Carregando');
  });

  it('should have "Renda" as the initial active color selection', () => {
    const activeCard = document.querySelector('.color-card.active');
    expect(activeCard).not.toBeNull();
    expect(activeCard.getAttribute('data-color')).toBe('renda');
  });
});