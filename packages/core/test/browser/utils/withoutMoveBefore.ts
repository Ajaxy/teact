// Imported first by move-fallback.test.tsx: removes `Element.prototype.moveBefore` before teact-dom.ts is evaluated
delete (Element.prototype as Partial<Element & { moveBefore: unknown }>).moveBefore;
