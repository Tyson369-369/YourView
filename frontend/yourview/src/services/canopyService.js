import supabase from './supabase'

export async function getCanopyCoverBySuburb(suburb) {
  const { data, error } = await supabase
    .rpc('get_canopy_cover_by_suburb', { suburb })

  if (error) {
    console.error('Error fetching canopy cover:', error)
    return null
  }

  return data?.[0] || null
}