'use client'

import posthog from 'posthog-js'
import {PostHogProvider} from 'posthog-js/react'
import React, {useEffect} from 'react'

export function PHProvider({
                               children,
                           }: {
    children: React.ReactNode
}) {
    useEffect(() => {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
            defaults: '2026-05-30',
        })
    }, [])

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}