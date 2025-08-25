import QueueChart from '@/components/QueueChart';
import FinishedTasksGauge from '@/components/FinishedTasksGauge';

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] relative">
      <QueueChart />
      <FinishedTasksGauge />
      <main className="flex flex-col items-center justify-center min-h-screen">
      </main>
      <footer className="absolute bottom-0 left-0 right-0 text-center mb-4">
        <div>
          <h1 className="text-4xl font-bold mb-4">OmniShift RISC</h1>
          <p className="text-lg text-gray-600">Real-time File Processing System</p>
        </div>
      </footer>
    </div>
  );
}
