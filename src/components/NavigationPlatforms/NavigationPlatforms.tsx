import Link from 'next/link'
import { Suspense } from 'react'

import { getPlatforms } from '@/models/Platform'

async function getPlatformsFromServer() {
  'use server'
  return getPlatforms()
}

type VersionProps = {
  platform: string
  version: string
}

const Version = ({ platform, version }: VersionProps) => (
  <li>
    <Link
      className="text-slate-200"
      href="/dashboard/[platform]/[version]"
      as={`/dashboard/${platform}/${version}`}
    >
      v{version}
    </Link>
  </li>
)

const NavigationPlatforms = async () => {
  const platforms = await getPlatformsFromServer()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ul className="font-mono px-2">
        {platforms.map((platform) => (
          <li className="py-2 w-full block" key={platform.name}>
            <Link
              className="text-slate-400 text-md font-bold"
              href="/dashboard/[platform]"
              as={`/dashboard/${platform.name}`}
            >
              {platform.name}
            </Link>

            <ul className="px-2 py-1 text-sm">
              {platform.versions?.map((version) => (
                <Version
                  key={`${platform}${version}`}
                  platform={platform.name}
                  version={version}
                />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Suspense>
  )
}

export default NavigationPlatforms
