export default function TestDynamic({ params }: { params: { slug: string } }) {
  return <div>Slug: {params.slug}</div>;
}