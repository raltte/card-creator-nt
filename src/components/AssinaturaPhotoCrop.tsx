import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface AssinaturaPhotoCropProps {
  open: boolean;
  imageDataUrl: string;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

const OUTPUT_SIZE = 260;
const DISPLAY_SIZE = 260;

export const AssinaturaPhotoCrop = ({ open, imageDataUrl, onCrop, onCancel }: AssinaturaPhotoCropProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState([100]);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const resetToCenter = useCallback((img: HTMLImageElement) => {
    const scale = Math.max(OUTPUT_SIZE / img.width, OUTPUT_SIZE / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    setPos({ x: (OUTPUT_SIZE - sw) / 2, y: (OUTPUT_SIZE - sh) / 2 });
    setZoom([100]);
  }, []);

  useEffect(() => {
    if (!imageDataUrl) return;
    const img = new Image();
    img.onload = () => {
      setImage(img);
      resetToCenter(img);
    };
    img.src = imageDataUrl;
  }, [imageDataUrl, resetToCenter]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = DISPLAY_SIZE;
    canvas.height = DISPLAY_SIZE;
    ctx.clearRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);

    const z = zoom[0] / 100;
    const baseScale = Math.max(OUTPUT_SIZE / image.width, OUTPUT_SIZE / image.height);
    const sw = image.width * baseScale * z;
    const sh = image.height * baseScale * z;

    ctx.save();
    ctx.beginPath();
    ctx.arc(DISPLAY_SIZE / 2, DISPLAY_SIZE / 2, DISPLAY_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, pos.x, pos.y, sw, sh);
    ctx.restore();

    // Circle border
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(DISPLAY_SIZE / 2, DISPLAY_SIZE / 2, DISPLAY_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [image, pos, zoom]);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPos(p => ({ x: p.x + (e.clientX - lastMouse.x), y: p.y + (e.clientY - lastMouse.y) }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const onMouseUp = () => setDragging(false);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    setLastMouse({ x: t.clientX, y: t.clientY });
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    setPos(p => ({ x: p.x + (t.clientX - lastMouse.x), y: p.y + (t.clientY - lastMouse.y) }));
    setLastMouse({ x: t.clientX, y: t.clientY });
  };

  const handleCrop = () => {
    if (!image) return;
    const out = document.createElement("canvas");
    out.width = OUTPUT_SIZE;
    out.height = OUTPUT_SIZE;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    const z = zoom[0] / 100;
    const baseScale = Math.max(OUTPUT_SIZE / image.width, OUTPUT_SIZE / image.height);
    const sw = image.width * baseScale * z;
    const sh = image.height * baseScale * z;
    ctx.drawImage(image, pos.x, pos.y, sw, sh);

    onCrop(out.toDataURL("image/jpeg", 0.9));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar foto</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <canvas
            ref={canvasRef}
            width={DISPLAY_SIZE}
            height={DISPLAY_SIZE}
            className="cursor-move rounded-full"
            style={{ touchAction: "none" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
          />
          <div className="w-full flex items-center gap-2">
            <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Slider value={zoom} onValueChange={setZoom} min={100} max={300} step={5} className="flex-1" />
            <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => image && resetToCenter(image)} className="gap-1">
              <RotateCcw className="h-3.5 w-3.5" /> Resetar
            </Button>
            <Button size="sm" onClick={handleCrop} className="flex-1">
              Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
