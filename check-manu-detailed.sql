SELECT 
  i.id,
  i.name,
  i.creation_status,
  i.profile_image_id,
  i.bodymap_image_id,
  i.profile_image_url,
  i.bodymap_url,
  i.profile_image_task_id,
  i.bodymap_task_id,
  gi.id as gen_image_id,
  gi.image_type,
  gi.status as gen_image_status,
  gi.task_id,
  gi.image_url as gen_image_url,
  gi.created_at as gen_image_created_at
FROM influencers i
LEFT JOIN generated_images gi ON gi.influencer_id = i.id
WHERE i.id = 'c4139a06-42d7-4c6f-8202-8259eff2fbcf'
ORDER BY gi.created_at DESC;
