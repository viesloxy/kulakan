export default function PageHeader({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                </p>
            ) : null}
        </div>
    );
}
