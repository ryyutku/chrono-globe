import ConverterWidget from '@/components/converter/ConverterWidget';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Title */}
      <h1 className="text-4xl font-light tracking-tight text-[#3b3221] mb-2">
        Chrono Globe
      </h1>
      <p className="text-sm text-[#8c7b64] mb-12">
        Precision timezone converter
      </p>

      {/* Converter Card Centered */}
      <ConverterWidget />
    </main>
  );
}