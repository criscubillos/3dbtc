'use client';

import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import LoadingScreen from '@/components/LoadingScreen';
import IndicatorOverlay from '@/components/IndicatorOverlay';
import ControlsHint from '@/components/ControlsHint';
import ViewControls from '@/components/ViewControls';
import Countdown from '@/components/Countdown';

const ThreeCanvas = dynamic(() => import('@/components/ThreeCanvas'), { ssr: false });

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <Header />
      <Sidebar />
      <ThreeCanvas />
      <IndicatorOverlay />
      <ControlsHint />
      <ViewControls />
      <Countdown />
    </>
  );
}
