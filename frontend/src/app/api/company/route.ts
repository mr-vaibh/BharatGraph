import companyData from '@/data/company_data.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const nameQuery = searchParams.get('name');
  const nseQuery = searchParams.get('nse');
  const bseQuery = searchParams.get('bse');

  const companies = Object.entries(companyData);

  if (nameQuery) {
    const query = nameQuery.toLowerCase();
    const filtered = companies
      .filter(([, data]) =>
        data.companyname?.toLowerCase().includes(query)
      )
      .map(([, data]) => data);

    return Response.json({ count: filtered.length, result: filtered });
  }

  if (nseQuery) {
    const match = companies.find(([, data]) => data.nsesymbol === nseQuery);
    return match ? Response.json(match[1]) : Response.json({ error: 'Company not found' }, { status: 404 });
  }

  if (bseQuery) {
    const match = companies.find(([, data]) => data.bsecode === bseQuery);
    return match ? Response.json(match[1]) : Response.json({ error: 'Company not found' }, { status: 404 });
  }

  // If no query, return all
  const allCompanies = Object.values(companyData);
  return Response.json({ count: allCompanies.length, result: allCompanies });
}
