/**
 * Example: Using the new Hand Animation Component
 * 
 * This replaces the full body avatar with just animated hands
 * Each post shows different hand gestures dynamically
 */

import React from 'react';
import { HandSignAvatar } from '@/components/sign-avatar';

export function LSFTranslationExample() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Simple usage with postId - fetches from API */}
      <section>
        <h2>Hand Animation Translator</h2>
        <HandSignAvatar
          postId="ahmed-detention-beauty"
          apiBaseUrl="/api"
          width={400}
          height={500}
          autoPlay={true}
        />
      </section>

      {/* Multiple translations side-by-side */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3>Post 1</h3>
          <HandSignAvatar
            postId="post-1"
            apiBaseUrl="/api"
            width={200}
            height={260}
            autoPlay={true}
          />
        </div>
        <div>
          <h3>Post 2</h3>
          <HandSignAvatar
            postId="post-2"
            apiBaseUrl="/api"
            width={200}
            height={260}
            autoPlay={false}
          />
        </div>
      </section>
    </div>
  );
}

export default LSFTranslationExample;
