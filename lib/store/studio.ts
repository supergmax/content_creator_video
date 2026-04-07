import { create } from 'zustand';
import type { TemplateId, VideoFormat } from '@/lib/templates';
import { TEMPLATES } from '@/lib/templates';

interface RenderState {
  isRendering: boolean;
  progress: number;
  lastRenderPath: string | null;
}

interface StudioState {
  templateId: TemplateId;
  props: Record<string, unknown>;
  format: VideoFormat;
  render: RenderState;
  isGenerating: boolean;
  setTemplateId: (id: TemplateId) => void;
  setProps: (props: Record<string, unknown>) => void;
  setProp: (key: string, value: unknown) => void;
  setFormat: (format: VideoFormat) => void;
  setRenderProgress: (progress: number) => void;
  setRenderComplete: (path: string) => void;
  setRenderIdle: () => void;
  setIsGenerating: (v: boolean) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  templateId: 'saas-promo',
  props: TEMPLATES['saas-promo'].defaultProps,
  format: '16:9',
  render: { isRendering: false, progress: 0, lastRenderPath: null },
  isGenerating: false,

  setTemplateId: (id) =>
    set({
      templateId: id,
      props: TEMPLATES[id].defaultProps,
      format: TEMPLATES[id].defaultFormat,
    }),

  setProps: (props) => set({ props }),

  setProp: (key, value) =>
    set((state) => ({
      props: { ...state.props, [key]: value },
    })),

  setFormat: (format) => set({ format }),

  setRenderProgress: (progress) =>
    set((state) => ({
      render: { ...state.render, isRendering: true, progress },
    })),

  setRenderComplete: (path) =>
    set({
      render: { isRendering: false, progress: 100, lastRenderPath: path },
    }),

  setRenderIdle: () =>
    set({
      render: { isRendering: false, progress: 0, lastRenderPath: null },
    }),

  setIsGenerating: (v) => set({ isGenerating: v }),
}));
