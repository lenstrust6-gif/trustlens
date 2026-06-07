import SearchContent from './search-content'

export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <SearchContent locale={locale} />
}
