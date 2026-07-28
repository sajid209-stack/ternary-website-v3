import { detailPreviewURL } from '@/utilities/livePreview'
import { revalidateTag } from 'next/cache'
import { CollectionConfig, slugField } from 'payload'

import { feedFields } from '@/collections/fields/feedFields'
import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'

const Insight: CollectionConfig = {
  slug: 'insight',
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  labels: {
    singular: 'Insight',
    plural: 'Insights',
  },
  // Drafts + scheduled publishing (WEB-454): editors can stage an article and pick a future
  // publish time. The Payload jobs queue (jobs.autoRun in payload.config.ts) flips the scheduled
  // draft to published when its time arrives. Public fetchers omit `draft`, so they default to
  // draft:false and only ever read the published version.
  versions: {
    drafts: { schedulePublish: true },
    maxPerDoc: 20,
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        if (doc?.slug) {
          revalidateTag(`insight_${doc.slug}`, { expire: 0 })
        }
        revalidateTag('insight', { expire: 0 })
      },
    ],
    // Deletes must bust the same tags, or list pages / embedding pages keep serving the removed doc.
    afterDelete: [
      ({ doc }) => {
        if (doc?.slug) {
          revalidateTag(`insight_${doc.slug}`, { expire: 0 })
        }
        revalidateTag('insight', { expire: 0 })
      },
    ],
  },
  admin: {
    group: 'Newsroom',
    description: 'Thought-leadership articles and insights.',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'publishedDate', 'updatedAt'],
    // Live preview routes through /next/preview so draft mode is on; detail route is
    // /<locale>/insights/<slug> (WEB-449).
    livePreview: {
      url: ({ data }) => detailPreviewURL('insight', 'insights', data),
    },
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField(),
    {
      name: 'code',
      label: 'Code',
      type: 'text',
      admin: {
        description: 'e.g. CS-014',
        position: 'sidebar',
      },
    },
    {
      name: 'author',
      label: 'Author',
      type: 'relationship',
      relationTo: 'team',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedDate',
      label: 'Published Date',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'readTime',
      label: 'Read Time',
      type: 'text',
      localized: true,
      admin: {
        description: 'e.g. "8 min"',
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
      name: 'excerpts',
      label: 'Excerpt',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Short summary used on listing cards.',
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
                description: 'Opening paragraph shown beside the article body.',
              },
            },
            {
              name: 'content',
              label: 'Content',
              type: 'richText',
              localized: true,
            },
          ],
        },
        {
          label: 'Related',
          fields: [
            {
              name: 'relatedInsights',
              label: 'Related Insights',
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
                  name: 'insights',
                  label: 'Insights',
                  type: 'relationship',
                  relationTo: 'insight',
                  hasMany: true,
                },
              ],
            },
          ],
        },
        {
          label: 'CTA',
          fields: [
            {
              name: 'cta',
              label: 'CTA',
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
                  name: 'backgroundImage',
                  label: 'Background Image',
                  type: 'upload',
                  relationTo: 'media',
                },
                {
                  name: 'button_1',
                  label: 'Button 1',
                  type: 'group',
                  fields: [
                    {
                      name: 'label',
                      label: 'Label',
                      type: 'text',
                      localized: true,
                    },
                    {
                      name: 'link',
                      label: 'Link',
                      type: 'text',
                    },
                  ],
                },
                {
                  name: 'button_2',
                  label: 'Button 2',
                  type: 'group',
                  fields: [
                    {
                      name: 'label',
                      label: 'Label',
                      type: 'text',
                      localized: true,
                    },
                    {
                      name: 'link',
                      label: 'Link',
                      type: 'text',
                    },
                  ],
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

export default Insight
