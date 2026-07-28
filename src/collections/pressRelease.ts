import { detailPreviewURL } from '@/utilities/livePreview'
import { revalidateTag } from 'next/cache'
import { CollectionConfig, slugField } from 'payload'

import { feedFields } from '@/collections/fields/feedFields'
import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'

const PressRelease: CollectionConfig = {
  slug: 'pressRelease',
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  labels: {
    singular: 'Press Release',
    plural: 'Press Releases',
  },
  // Drafts + scheduled publishing (WEB-454): a press release can be embargoed by scheduling a
  // future publish time. The Payload jobs queue (jobs.autoRun in payload.config.ts) promotes the
  // scheduled draft when that time arrives. Public fetchers omit `draft`, so they default to
  // draft:false and only ever read the published version.
  versions: {
    drafts: { schedulePublish: true },
    maxPerDoc: 20,
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        if (doc?.slug) {
          revalidateTag(`pressRelease_${doc.slug}`, { expire: 0 })
        }
        revalidateTag('pressRelease', { expire: 0 })
      },
    ],
    // Deletes must bust the same tags, or list pages / embedding pages keep serving the removed doc.
    afterDelete: [
      ({ doc }) => {
        if (doc?.slug) {
          revalidateTag(`pressRelease_${doc.slug}`, { expire: 0 })
        }
        revalidateTag('pressRelease', { expire: 0 })
      },
    ],
  },
  admin: {
    group: 'Newsroom',
    description: 'Official press releases and announcements.',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'code', 'releaseDate', 'updatedAt'],
    // Live preview routes through /next/preview so draft mode is on; detail route is
    // /<locale>/press-release/<slug> (WEB-449).
    livePreview: {
      url: ({ data }) => detailPreviewURL('pressRelease', 'press-release', data),
    },
  },
  fields: [
    {
      name: 'title',
      label: 'Headline',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField(),
    {
      name: 'badge',
      label: 'Badge',
      type: 'text',
      localized: true,
      admin: {
        description: 'Pill label shown above the headline (e.g. Product Launch).',
      },
    },
    {
      name: 'code',
      label: 'Release ID',
      type: 'text',
      admin: {
        description: 'e.g. PR-026',
        position: 'sidebar',
      },
    },
    {
      name: 'releaseDate',
      label: 'Release Date',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'datelineLocation',
      label: 'Dateline Location',
      type: 'text',
      localized: true,
      admin: {
        description: 'e.g. Dhaka, Bangladesh',
      },
    },
    {
      name: 'excerpts',
      label: 'Excerpt',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Short summary used on listing cards.',
      },
    },
    {
      name: 'readTime',
      label: 'Read Time',
      type: 'text',
      localized: true,
      admin: {
        description: 'e.g. "12 min"',
        position: 'sidebar',
      },
    },
    {
      name: 'categoryLabel',
      label: 'Category Label',
      type: 'text',
      localized: true,
      admin: {
        description: 'e.g. "Engineering Studio"',
        position: 'sidebar',
      },
    },
    {
      name: 'thumbnail',
      label: 'Thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'tags',
      label: 'Tags',
      type: 'array',
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Lead & Content',
          fields: [
            {
              name: 'leadParagraph',
              label: 'Lead Paragraph',
              type: 'richText',
              localized: true,
              admin: {
                description: 'Opening paragraphs shown in The release section. Separate paragraphs with a blank line.',
              },
            },
            {
              name: 'content',
              label: 'Content',
              type: 'richText',
              localized: true,
            },
            {
              name: 'quotes',
              label: 'Quotes',
              type: 'array',
              fields: [
                {
                  name: 'quote',
                  label: 'Quote',
                  type: 'textarea',
                  localized: true,
                },
                {
                  name: 'name',
                  label: 'Name',
                  type: 'text',
                  localized: true,
                },
                {
                  name: 'role',
                  label: 'Role',
                  type: 'text',
                  localized: true,
                  admin: {
                    description: 'e.g. Chief Revenue Officer · Counterfoil',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Release Facts',
          fields: [
            {
              name: 'releaseFacts',
              label: 'Release Facts',
              type: 'group',
              fields: [
                {
                  name: 'forImmediateRelease',
                  label: 'For Immediate Release',
                  type: 'text',
                  localized: true,
                  admin: {
                    description: 'e.g. Yes',
                  },
                },
                {
                  name: 'embargo',
                  label: 'Embargo',
                  type: 'text',
                  localized: true,
                  admin: {
                    description: 'e.g. None',
                  },
                },
                {
                  name: 'distribution',
                  label: 'Distribution',
                  type: 'text',
                  localized: true,
                  admin: {
                    description: 'e.g. Global',
                  },
                },
                {
                  name: 'mediaKit',
                  label: 'Media Kit',
                  type: 'upload',
                  relationTo: 'media',
                },
                {
                  name: 'mediaKitSizeLabel',
                  label: 'Media Kit Size Label',
                  type: 'text',
                  localized: true,
                  admin: {
                    description: 'e.g. 24 MB',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Press & Analyst Contact',
          fields: [
            {
              name: 'pressContact',
              label: 'Press & Analyst Contact',
              type: 'group',
              fields: [
                {
                  name: 'heading',
                  label: 'Heading',
                  type: 'text',
                  localized: true,
                },
                {
                  name: 'description',
                  label: 'Description',
                  type: 'richText',
                  localized: true,
                },
                {
                  name: 'press',
                  label: 'Press Inquiries',
                  type: 'group',
                  fields: [
                    {
                      name: 'name',
                      label: 'Name',
                      type: 'text',
                      localized: true,
                    },
                    {
                      name: 'title',
                      label: 'Title',
                      type: 'text',
                      localized: true,
                    },
                    {
                      name: 'email',
                      label: 'Email',
                      type: 'text',
                    },
                    {
                      name: 'phone',
                      label: 'Phone',
                      type: 'text',
                    },
                  ],
                },
                {
                  name: 'analyst',
                  label: 'Analyst Relations',
                  type: 'group',
                  fields: [
                    {
                      name: 'name',
                      label: 'Name',
                      type: 'text',
                      localized: true,
                    },
                    {
                      name: 'title',
                      label: 'Title',
                      type: 'text',
                      localized: true,
                    },
                    {
                      name: 'email',
                      label: 'Email',
                      type: 'text',
                    },
                    {
                      name: 'website',
                      label: 'Website',
                      type: 'text',
                    },
                  ],
                },
                {
                  name: 'mediaKitDescription',
                  label: 'Media Kit Description',
                  type: 'text',
                  localized: true,
                  admin: {
                    description: 'e.g. Logos, executive headshots, product screenshots, brand guidelines',
                  },
                },
                {
                  name: 'socialLinks',
                  label: 'Social Links',
                  type: 'group',
                  fields: [
                    {
                      name: 'twitter',
                      label: 'Twitter / X',
                      type: 'text',
                    },
                    {
                      name: 'linkedin',
                      label: 'LinkedIn',
                      type: 'text',
                    },
                    {
                      name: 'website',
                      label: 'Website',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Related',
          fields: [
            {
              name: 'relatedPressReleases',
              label: 'Related Press Releases',
              type: 'group',
              fields: [
                {
                  name: 'heading',
                  label: 'Heading',
                  type: 'text',
                  localized: true,
                },
                {
                  name: 'description',
                  label: 'Description',
                  type: 'richText',
                  localized: true,
                },
                {
                  name: 'pressReleases',
                  label: 'Press Releases',
                  type: 'relationship',
                  relationTo: 'pressRelease',
                  hasMany: true,
                },
              ],
            },
          ],
        },
      ],
    },
    ...feedFields,
  ],
}

export default PressRelease
