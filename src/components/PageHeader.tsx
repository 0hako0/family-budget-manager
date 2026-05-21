type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-normal text-ink sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/65 sm:text-base">{description}</p>
    </div>
  );
}
