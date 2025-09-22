import supabase from './supabase'

export async function getCanopyCoverBySuburb(suburb) {
  try {
    const cleanedSuburb = suburb.replace(/\s*VIC.*$/i, '').replace(/,.*$/, '').trim();
    const { data, error } = await supabase
      .rpc('get_canopy_cover_by_suburb', { suburb: cleanedSuburb });

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Error fetching canopy cover:', err);
    return null;
  }
}