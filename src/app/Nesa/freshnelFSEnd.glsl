

//vec4 aColor = texture2D( matcapSelect, uv );
//vec4 bColor = ;

float c = 0.6;

//hol lesz nulla?


float z = (1.0 - clamp(-(vBallCenters.z - 0.08) / 0.080117 * 0.6, 0.0, 1.0)) * (1.0 - c) + c;

//z = 1.0 - clamp((0.080117 - vBallCenters.z) / (0.080117 * (0.6 / 0.4)), 0.0, 1.0);

float fog = 1.0 - clamp(-vBallCenters.z / 0.4, 0.0, 1.0);



gl_FragColor = mix(mix(texture2D( matcap3, uv ), texture2D( matcap2, uv ), vBallT.y), texture2D( matcap, uv ), vBallT.x);

//gl_FragColor.rgb = vec3(vBallT.x, vBallT.y, vBallT.y);



//gl_FragColor = vec4(fog, fog, fog, 1.0);
//gl_FragColor = vec4(z, z, z, 1.0);


//gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);


gl_FragColor.a = vBallCenters.x;





