import { useEffect, useState } from 'react';
import { isSpeaking, subscribeSpeaking } from '../audio';

/** True while the native voice assistant is currently speaking anything. */
export function useSpeaking() {
  const [speaking, setSpeakingState] = useState(isSpeaking());

  useEffect(() => subscribeSpeaking(setSpeakingState), []);

  return speaking;
}

export default useSpeaking;
