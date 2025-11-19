import React from 'react';
import { Entity, Scene } from 'react-aframe';

interface VRBookingTrialProps {
  experience: {
    title: string;
    description: string;
    image: string;
  };
}

const VRBookingTrial: React.FC<VRBookingTrialProps> = ({ experience }) => {
  return (
    <Scene>
      <Entity primitive="a-sky" src={experience.image} />
      <Entity
        text={{
          value: experience.title,
          align: 'center',
          color: 'white',
          width: 6
        }}
        position={{ x: 0, y: 2, z: -3 }}
      />
      <Entity
        text={{
          value: experience.description,
          align: 'center',
          color: 'white',
          width: 6
        }}
        position={{ x: 0, y: 1, z: -3 }}
      />
      <Entity
        primitive="a-plane"
        position={{ x: 0, y: 0, z: -4 }}
        rotation={{ x: -90, y: 0, z: 0 }}
        width={4}
        height={4}
        color="#7BC8A4"
      />
      <Entity primitive="a-camera">
        <Entity
          primitive="a-cursor"
          animation__click={{
            property: 'scale',
            startEvents: 'click',
            from: '0.1 0.1 0.1',
            to: '1 1 1',
            dur: 150
          }}
        />
      </Entity>
    </Scene>
  );
};

export default VRBookingTrial;